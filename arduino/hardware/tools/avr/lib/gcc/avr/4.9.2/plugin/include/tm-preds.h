/* Generated automatically by the program 'build/genpreds'
   from the machine description file '../../gcc/gcc/config/avr/avr.md'.  */

#ifndef GCC_TM_PREDS_H
#define GCC_TM_PREDS_H

#ifdef HAVE_MACHINE_MODES
extern int general_operand (rtx, enum machine_mode);
extern int address_operand (rtx, enum machine_mode);
extern int register_operand (rtx, enum machine_mode);
extern int pmode_register_operand (rtx, enum machine_mode);
extern int scratch_operand (rtx, enum machine_mode);
extern int immediate_operand (rtx, enum machine_mode);
extern int const_int_operand (rtx, enum machine_mode);
extern int const_double_operand (rtx, enum machine_mode);
extern int nonimmediate_operand (rtx, enum machine_mode);
extern int nonmemory_operand (rtx, enum machine_mode);
extern int push_operand (rtx, enum machine_mode);
extern int pop_operand (rtx, enum machine_mode);
extern int memory_operand (rtx, enum machine_mode);
extern int indirect_operand (rtx, enum machine_mode);
extern int ordered_comparison_operator (rtx, enum machine_mode);
extern int comparison_operator (rtx, enum machine_mode);
extern int l_register_operand (rtx, enum machine_mode);
extern int d_register_operand (rtx, enum machine_mode);
extern int even_register_operand (rtx, enum machine_mode);
extern int odd_register_operand (rtx, enum machine_mode);
extern int stack_register_operand (rtx, enum machine_mode);
extern int low_io_address_operand (rtx, enum machine_mode);
extern int high_io_address_operand (rtx, enum machine_mode);
extern int io_address_operand (rtx, enum machine_mode);
extern int nop_general_operand (rtx, enum machine_mode);
extern int nox_general_operand (rtx, enum machine_mode);
extern int flash_operand (rtx, enum machine_mode);
extern int const0_operand (rtx, enum machine_mode);
extern int const1_operand (rtx, enum machine_mode);
extern int const_0_to_7_operand (rtx, enum machine_mode);
extern int const_2_to_7_operand (rtx, enum machine_mode);
extern int const_1_to_6_operand (rtx, enum machine_mode);
extern int const_2_to_6_operand (rtx, enum machine_mode);
extern int reg_or_0_operand (rtx, enum machine_mode);
extern int symbol_ref_operand (rtx, enum machine_mode);
extern int text_segment_operand (rtx, enum machine_mode);
extern int single_one_operand (rtx, enum machine_mode);
extern int single_zero_operand (rtx, enum machine_mode);
extern int avr_sp_immediate_operand (rtx, enum machine_mode);
extern int eqne_operator (rtx, enum machine_mode);
extern int gelt_operator (rtx, enum machine_mode);
extern int difficult_comparison_operator (rtx, enum machine_mode);
extern int simple_comparison_operator (rtx, enum machine_mode);
extern int call_insn_operand (rtx, enum machine_mode);
extern int pseudo_register_operand (rtx, enum machine_mode);
extern int pseudo_register_or_const_int_operand (rtx, enum machine_mode);
extern int combine_pseudo_register_operand (rtx, enum machine_mode);
extern int const_8_16_24_operand (rtx, enum machine_mode);
extern int u8_operand (rtx, enum machine_mode);
extern int s8_operand (rtx, enum machine_mode);
extern int o8_operand (rtx, enum machine_mode);
extern int s9_operand (rtx, enum machine_mode);
extern int register_or_s9_operand (rtx, enum machine_mode);
extern int u16_operand (rtx, enum machine_mode);
extern int s16_operand (rtx, enum machine_mode);
extern int o16_operand (rtx, enum machine_mode);
extern int const_operand (rtx, enum machine_mode);
extern int nonmemory_or_const_operand (rtx, enum machine_mode);
extern int const_or_immediate_operand (rtx, enum machine_mode);
#endif /* HAVE_MACHINE_MODES */

#define CONSTRAINT_NUM_DEFINED_P 1
enum constraint_num
{
  CONSTRAINT__UNKNOWN = 0,
  CONSTRAINT_t,
  CONSTRAINT_b,
  CONSTRAINT_e,
  CONSTRAINT_w,
  CONSTRAINT_d,
  CONSTRAINT_l,
  CONSTRAINT_a,
  CONSTRAINT_x,
  CONSTRAINT_y,
  CONSTRAINT_z,
  CONSTRAINT_q,
  CONSTRAINT_I,
  CONSTRAINT_J,
  CONSTRAINT_K,
  CONSTRAINT_L,
  CONSTRAINT_M,
  CONSTRAINT_N,
  CONSTRAINT_O,
  CONSTRAINT_P,
  CONSTRAINT_G,
  CONSTRAINT_Q,
  CONSTRAINT_Cm2,
  CONSTRAINT_C03,
  CONSTRAINT_C04,
  CONSTRAINT_C05,
  CONSTRAINT_C06,
  CONSTRAINT_C07,
  CONSTRAINT_Ca2,
  CONSTRAINT_Ca3,
  CONSTRAINT_Ca4,
  CONSTRAINT_Co2,
  CONSTRAINT_Co3,
  CONSTRAINT_Co4,
  CONSTRAINT_Cx2,
  CONSTRAINT_Cx3,
  CONSTRAINT_Cx4,
  CONSTRAINT_Csp,
  CONSTRAINT_Cxf,
  CONSTRAINT_C0f,
  CONSTRAINT_Ynn,
  CONSTRAINT_Y00,
  CONSTRAINT_Y01,
  CONSTRAINT_Ym1,
  CONSTRAINT_Y02,
  CONSTRAINT_Ym2,
  CONSTRAINT_YIJ,
  CONSTRAINT__LIMIT
};

extern enum constraint_num lookup_constraint (const char *);
extern bool constraint_satisfied_p (rtx, enum constraint_num);

static inline size_t
insn_constraint_len (char fc, const char *str ATTRIBUTE_UNUSED)
{
  switch (fc)
    {
    case 'C': return 3;
    case 'Y': return 3;
    default: break;
    }
  return 1;
}

#define CONSTRAINT_LEN(c_,s_) insn_constraint_len (c_,s_)

extern enum reg_class regclass_for_constraint (enum constraint_num);
#define REG_CLASS_FROM_CONSTRAINT(c_,s_) \
    regclass_for_constraint (lookup_constraint (s_))
#define REG_CLASS_FOR_CONSTRAINT(x_) \
    regclass_for_constraint (x_)

extern bool insn_const_int_ok_for_constraint (HOST_WIDE_INT, enum constraint_num);
#define CONST_OK_FOR_CONSTRAINT_P(v_,c_,s_) \
    insn_const_int_ok_for_constraint (v_, lookup_constraint (s_))

#define CONST_DOUBLE_OK_FOR_CONSTRAINT_P(v_,c_,s_) \
    constraint_satisfied_p (v_, lookup_constraint (s_))

#define EXTRA_CONSTRAINT_STR(v_,c_,s_) \
    constraint_satisfied_p (v_, lookup_constraint (s_))

extern bool insn_extra_memory_constraint (enum constraint_num);
#define EXTRA_MEMORY_CONSTRAINT(c_,s_) insn_extra_memory_constraint (lookup_constraint (s_))

#define EXTRA_ADDRESS_CONSTRAINT(c_,s_) false

#endif /* tm-preds.h */
